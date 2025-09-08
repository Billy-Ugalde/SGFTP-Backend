export class ContentBlockItemDto {
  text: string | null;
  image: string | null;
}

export class StructuredContentDto {
  [section: string]: {
    [blockKey: string]: string | null;
  };
}

