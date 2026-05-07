import clsx from 'clsx';
import { isRichTextEmpty, sanitizeRichText } from '../utils/richText';

export default function RichTextContent({ html, className, emptyText }) {
  if (isRichTextEmpty(html)) {
    return emptyText ? <div className={clsx('rich-text-content rich-text-empty', className)}>{emptyText}</div> : null;
  }

  return (
    <div
      className={clsx('rich-text-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
