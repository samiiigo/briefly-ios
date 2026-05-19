import Foundation

enum BrieflyOnDeviceSummarizer {
  static func summarize(text: String) -> [String: Any] {
    let sentences = text
      .components(separatedBy: CharacterSet(charactersIn: ".!?"))
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { $0.count > 20 }

    let summary = sentences.prefix(3).joined(separator: ". ")
    let keywords = ["decide", "action", "will", "should", "must", "key", "important"]
    let insights = sentences
      .filter { s in keywords.contains { s.lowercased().contains($0) } }
      .prefix(5)
      .map { $0 }

    return [
      "summary": summary.isEmpty ? String(text.prefix(200)) : summary,
      "keyInsights": insights.isEmpty && !sentences.isEmpty ? [sentences[0]] : Array(insights),
    ]
  }
}
