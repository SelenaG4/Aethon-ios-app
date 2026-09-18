import UIKit
import React

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    if let factory = (UIApplication.shared.delegate as? AppDelegate)?.reactNativeFactory {
      factory.startReactNative(withModuleName: "Aethon", in: window)
    }

    window.makeKeyAndVisible()

    if let urlContext = connectionOptions.urlContexts.first {
      forwardToLinkingManager(urlContext)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let urlContext = URLContexts.first else { return }
    forwardToLinkingManager(urlContext)
  }

  // Keeps aethon:// deep links working once that scheme is registered —
  // this is the scene-lifecycle equivalent of AppDelegate's
  // application(_:open:options:).
  private func forwardToLinkingManager(_ urlContext: UIOpenURLContext) {
    let options: [UIApplication.OpenURLOptionsKey: Any] = [
      .sourceApplication: urlContext.options.sourceApplication as Any,
      .annotation: urlContext.options.annotation as Any,
      .openInPlace: urlContext.options.openInPlace,
    ]
    RCTLinkingManager.application(UIApplication.shared, open: urlContext.url, options: options)
  }
}
