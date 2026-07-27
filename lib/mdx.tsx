import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import type { ComponentType } from "react";

export async function renderMdx(
  source: string,
  components: Record<string, ComponentType<any>>
) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
