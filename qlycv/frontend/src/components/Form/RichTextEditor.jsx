import { useId, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  AutoImage,
  AutoLink,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  PasteFromOffice,
  PictureEditing,
  Underline,
  Undo,
} from 'ckeditor5';
import { getRichTextLength } from '../../utils/richText';
import 'ckeditor5/ckeditor5.css';
import './RichTextEditor.css';

const EDITOR_PLUGINS = [
  Essentials,
  Paragraph,
  Heading,
  AutoImage,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  PictureEditing,
  Base64UploadAdapter,
  Bold,
  Italic,
  Underline,
  Link,
  AutoLink,
  List,
  ListProperties,
  BlockQuote,
  HorizontalLine,
  PasteFromOffice,
  Undo,
];

const TOOLBAR_ITEMS = [
  'undo',
  'redo',
  '|',
  'heading',
  '|',
  'bold',
  'italic',
  'underline',
  '|',
  'insertImage',
  '|',
  'link',
  'bulletedList',
  'numberedList',
  '|',
  'blockQuote',
  'horizontalLine',
];

export default function RichTextEditor({
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  error,
  minLength,
}) {
  const inputId = useId();
  const textLength = getRichTextLength(value);
  const helperTone = minLength && textLength < minLength ? 'warning' : 'success';

  const config = useMemo(
    () => ({
      licenseKey: 'GPL',
      plugins: EDITOR_PLUGINS,
      toolbar: {
        items: TOOLBAR_ITEMS,
        shouldNotGroupWhenFull: true,
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Doan van', class: 'ck-heading_paragraph' },
          { model: 'heading2', view: 'h2', title: 'Tieu de lon', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Tieu de vua', class: 'ck-heading_heading3' },
        ],
      },
      image: {
        toolbar: ['toggleImageCaption', 'imageTextAlternative', '|', 'resizeImage'],
        resizeOptions: [
          { name: 'resizeImage:original', value: null, label: '100%' },
          { name: 'resizeImage:75', value: '75', label: '75%' },
          { name: 'resizeImage:50', value: '50', label: '50%' },
        ],
      },
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true,
        },
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
      },
      placeholder,
    }),
    [placeholder]
  );

  return (
    <div className="form-group rich-text-field">
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="rich-text-editor-shell">
        <CKEditor
          editor={ClassicEditor}
          config={config}
          data={value || ''}
          onChange={(_, editor) => onChange?.(editor.getData())}
          onBlur={() => onBlur?.({ target: { name } })}
        />
      </div>
      {(helperText || minLength) && (
        <div className="rich-text-field-meta">
          <span className="rich-text-field-helper">{helperText}</span>
          {minLength ? (
            <span className={`rich-text-field-count is-${helperTone}`}>
              {textLength} ky tu {minLength ? `(khuyen nghi: >=${minLength})` : ''}
            </span>
          ) : null}
        </div>
      )}
      {error ? <span className="error">{error}</span> : null}
    </div>
  );
}
