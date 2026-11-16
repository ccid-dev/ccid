import Link from "next/link";
import type { SiteLink } from "@repo/blocks";

/** 공용 카드(@repo/blocks)에 넘기는 링크: next/link + 커스텀 커서 설명 */
export const SiteNextLink: SiteLink = ({ cursorLabel, ...props }) => (
  <Link {...props} cursor-label={cursorLabel} />
);
