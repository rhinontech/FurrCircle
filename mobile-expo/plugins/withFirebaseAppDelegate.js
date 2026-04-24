const { withAppDelegate, withPodfile } = require('@expo/config-plugins');

const withFirebaseIOSFixes = (config) => {
  // 1. AppDelegate fixes (Firebase initialization)
  config = withAppDelegate(config, (config) => {
    let appDelegate = config.modResults.contents;
    if (!appDelegate.includes('import FirebaseCore')) {
      appDelegate = appDelegate.replace(/import Expo/, 'import FirebaseCore\nimport Firebase\nimport Expo');
    }
    if (!appDelegate.includes('import UIKit')) {
      appDelegate = 'import UIKit\n' + appDelegate;
    }
    
    if (!appDelegate.includes('FirebaseApp.configure()')) {
      const findString = /(?:public\s+)?(?:override\s+)?func\s+application\(\s*_\s*application:\s*UIApplication,\s*didFinishLaunchingWithOptions\s*launchOptions:\s*\[UIApplication\.LaunchOptionsKey:\s*Any\]\?\s*\)\s*->\s*Bool\s*\{/;
      if (findString.test(appDelegate)) {
        appDelegate = appDelegate.replace(findString, (match) => `${match}\n    FirebaseApp.configure()`);
      } else {
        appDelegate = appDelegate.replace(
          /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
          'FirebaseApp.configure()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)'
        );
      }
    }
    config.modResults.contents = appDelegate;
    return config;
  });

  // 2. Podfile fixes
  config = withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Use modular headers globally - this satisfies Firebase without the strictness of use_frameworks!
    if (!podfile.includes('use_modular_headers!')) {
      podfile = podfile.replace(/platform :ios/, 'use_modular_headers!\nplatform :ios');
    }

    // Ensure Firebase is aware of the configuration
    if (!podfile.includes('$RNFirebaseAsStaticFramework = true')) {
      podfile = '$RNFirebaseAsStaticFramework = true\n' + podfile;
    }

    config.modResults.contents = podfile;
    return config;
  });

  return config;
};

module.exports = withFirebaseIOSFixes;
