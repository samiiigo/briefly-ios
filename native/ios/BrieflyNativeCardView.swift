import SwiftUI
import React

struct BrieflyCard: View {
  let title: String

  var body: some View {
    Text(title)
      .font(.headline)
      .padding()
      .frame(maxWidth: .infinity)
      .background(Color(.secondarySystemBackground))
      .cornerRadius(12)
  }
}

@objc(BrieflyNativeCardViewManager)
final class BrieflyNativeCardViewManager: RCTViewManager {
  override func view() -> UIView! {
    UIHostingController(rootView: BrieflyCard(title: "Briefly")).view
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
