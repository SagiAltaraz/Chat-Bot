import { reviewRepository } from '../repositories/review.repository';
import { llmClient } from '../llm/client';
import template from '../prompts/summarize_reviews.txt';

export const reviewService = {
   async summarizeReviews(productId: number): Promise<String> {
      const existingSummary =
         await reviewRepository.getReviewSummary(productId);
      if (existingSummary) return existingSummary;

      const review = await reviewRepository.getReviews(productId, 10);
      const joinedReviews = review.map((r) => r.content).join('\n\n');
      const prompt = template.replace('{{reviews}}', joinedReviews);
      const { text: summary } = await llmClient.generateText({
         model: 'gpt-4.1',
         prompt,
         temperature: 0.2,
         maxTokens: 500,
      });
      await reviewRepository.storeReviewSummary(productId, summary);

      return summary;
   },
};
