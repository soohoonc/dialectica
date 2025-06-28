import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const tagRouter = createTRPCRouter({
  // DISABLED: Use markdown file creation instead
  // create: publicProcedure
  //   .input(z.object({
  //     name: z.string(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database creation disabled. Use MarkdownTemplates.createTagFile() instead.');
  //   }),

  get: publicProcedure
    .input(z.object({
      id: z.string(), // Using slug as ID
    }))
    .query(async ({ input }) => {
      // Check if tag documentation exists
      const data = await MarkdownUtils.readMarkdown('relationships', input.id);
      
      // Get tag usage count from ideas
      const tags = await MarkdownUtils.getAllTagsFromMarkdown();
      const tag = tags.find(t => MarkdownUtils.slugify(t.name) === input.id);
      
      if (!tag) return null;
      
      return {
        id: input.id,
        name: tag.name,
      };
    }),

  // DISABLED: Edit markdown files directly instead
  // update: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //     name: z.string(),
  //     tag: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database updates disabled. Edit markdown files directly.');
  //   }),

  // DISABLED: Delete markdown files directly instead
  // delete: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database deletion disabled. Delete markdown files directly.');
  //   }),

  list: publicProcedure
    .query(async () => {
      // Read tags from markdown files (extracted from ideas)
      const tags = await MarkdownUtils.getAllTagsFromMarkdown();
      
      // Sort by name
      tags.sort((a, b) => a.name.localeCompare(b.name));
      
      // Transform to match expected format
      return tags.map(tag => ({
        id: MarkdownUtils.slugify(tag.name), // Using slug as ID
        name: tag.name,
      }));
    }),
});