export type ChapterStatus = "draft" | "published";

export interface ChapterMeta {
  title: string;
  slug: string;
  part: string;
  partTitle: string;
  chapterNumber: number;
  summary: string;
  status: ChapterStatus;
  previous: string | null;
  next: string | null;
  featuredImage?: string;
  videoPoster?: string;
  updatedDate?: string;
  readingTime?: string;
  fullWidth?: boolean;
}

export interface Chapter {
  meta: ChapterMeta;
  content: string;
  filePath: string;
}

export interface TocEntry {
  title: string;
  slug: string;
  part: string;
  chapterNumber: number;
  summary: string;
  status: ChapterStatus;
}

export interface TocPart {
  part: string;
  partTitle: string;
  chapters: TocEntry[];
}

export interface AdjacentChapters {
  previous: TocEntry | null;
  next: TocEntry | null;
}

export interface Heading {
  depth: 2 | 3;
  text: string;
  slug: string;
}
