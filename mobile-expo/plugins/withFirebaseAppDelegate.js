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

  // 2. Podfile fixes (Modular headers and Xcode Build Settings)
  config = withPodfile(config, (config) => {
    let podfile = config.modResults.contents;
    
    // Add use_modular_headers! globally if missing
    if (!podfile.includes('use_modular_headers!')) {
      podfile = podfile.replace(/platform :ios/, 'use_modular_headers!\nplatform :ios');
    }

    // Fix for the "non-modular header" build error in RNFB modules
    const postInstallFix = `
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end`;

    if (!podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
      podfile = podfile.replace(/react_native_post_install\(/, `${postInstallFix}\n    react_native_post_install(`);
    }

    config.modResults.contents = podfile;
    return config;
  });

  return config;
};

module.exports = withFirebaseIOSFixes;
