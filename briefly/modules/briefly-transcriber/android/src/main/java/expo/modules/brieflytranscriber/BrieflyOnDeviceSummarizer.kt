package expo.modules.brieflytranscriber

object BrieflyOnDeviceSummarizer {
  fun summarize(text: String): Map<String, Any> {
    val sentences = text
      .split(Regex("[.!?]+"))
      .map { it.trim() }
      .filter { it.length > 20 }

    val summary = sentences.take(3).joinToString(". ")
    val keywords = listOf("decide", "action", "will", "should", "must", "key", "important")
    val insights = sentences
      .filter { sentence -> keywords.any { keyword -> sentence.lowercase().contains(keyword) } }
      .take(5)

    val keyInsights: List<String> = when {
      insights.isNotEmpty() -> insights
      sentences.isNotEmpty() -> listOf(sentences[0])
      else -> emptyList()
    }

    return mapOf(
      "summary" to summary.ifEmpty { text.take(200) },
      "keyInsights" to keyInsights,
    )
  }
}
