export interface SingleCard {
  id: number;
  title: string;
  href: string;
  description: string;
  imageUrl: string;
  date: string;
  datetime: string;
  category?: {
    title: string;
    href: string;
  };
  author: {
    name: string;
    role: string;
    href: string;
    imageUrl: string;
  };
}

export interface CardsProps {
  type: "cards";
  sectionIdx?: number;
  sectionTitle: string;
  sectionCaption: string;
  cards: SingleCard[];
}
