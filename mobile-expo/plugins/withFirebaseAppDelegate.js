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

    // 1.1 OpenURL fix for Firebase Phone Auth (reCAPTCHA)
    if (!appDelegate.includes('url.host?.caseInsensitiveCompare("firebaseauth")')) {
      const openUrlPattern = /func\s+application\(\s*_\s*app:\s*UIApplication,\s*open\s*url:\s*URL,\s*options:\s*\[UIApplication\.OpenURLOptionsKey:\s*Any\]\s*=\s*\[:\]\s*\)\s*->\s*Bool\s*\{/;
      if (openUrlPattern.test(appDelegate)) {
        appDelegate = appDelegate.replace(openUrlPattern, (match) => 
          `${match}\n    if url.host?.caseInsensitiveCompare("firebaseauth") == .orderedSame {\n        return false\n    }`
        );
      }
    }

    config.modResults.contents = appDelegate;
    return config;
  });

  // 2. Podfile fixes
  config = withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Ensure Firebase is aware of the configuration
    if (!podfile.includes('$RNFirebaseAsStaticFramework = true')) {
      podfile = '$RNFirebaseAsStaticFramework = true\n' + podfile;
    }

    // Use modular headers globally - this satisfies Firebase without the strictness of use_frameworks!
    if (!podfile.includes('use_modular_headers!')) {
      podfile = podfile.replace(/platform :ios/, 'use_modular_headers!\nplatform :ios');
    }

    // Add pre_install fix to force RNFB pods to be static libraries
    const preInstallFix = `
    pre_install do |installer|
      installer.pod_targets.each do |pod|
        if pod.name.start_with?('RNFB')
          def pod.build_type
            Pod::BuildType.static_library
          end
        end
      end
    end`;

    if (!podfile.includes('pre_install do |installer|')) {
      podfile = podfile.replace(/target 'FurrCircle' do/, `${preInstallFix}\n\ntarget 'FurrCircle' do`);
    }

    // Add post_install fix for module visibility and "Include of non-modular header" issues
    const fixMarker = '# Firebase Module Visibility Fix (v3)';
    const nonModularFix = `
    ${fixMarker}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Fix "Include of non-modular header inside framework module"
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        
        # Fix "Declaration of ... must be imported from module ... before it is required"
        config.build_settings['DEFINES_MODULE'] = 'YES'
        
        # Ensure React headers are found even in modular builds
        config.build_settings['HEADER_SEARCH_PATHS'] = '$(inherited) "\\\${PODS_ROOT}/Headers/Public/React-Core"'

        if target.name.start_with?('RNFB')
          # Ensure modules are enabled and correctly configured for RNFB pods
          config.build_settings['OTHER_CFLAGS'] = '$(inherited) -fmodules -fcxx-modules'
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= '$(inherited) '
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'RNFB_LATEST=1'
        end
      end
    end
    # End Firebase Module Visibility Fix`;

    if (!podfile.includes(fixMarker)) {
      // Remove any previous versions of any firebase fixes in post_install
      podfile = podfile.replace(/# (Firebase Module Visibility Fix|Firebase Module Visibility Fix \(v2\)|Firebase Module Visibility Fix \(v3\))[\s\S]*?(# End Firebase Module Visibility Fix|react_native_post_install)/g, (match) => {
        return match.includes('react_native_post_install') ? 'react_native_post_install' : '';
      });
      
      podfile = podfile.replace(
        /react_native_post_install\(/,
        `${nonModularFix}\n    react_native_post_install(`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });

  return config;
};

module.exports = withFirebaseIOSFixes;
