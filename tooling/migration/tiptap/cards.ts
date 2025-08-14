import { Node } from "@tiptap/core";

export const IsomerCards = Node.create({
  name: "isomercards",
  group: "block",
  draggable: true,
  priority: 300,

  content: "isomercard+",

  parseHTML() {
    return [
      {
        tag: ".isomer-card-grid",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

export const IsomerCard = Node.create({
  name: "isomercard",
  group: "isomercardblock",
  atom: true,
  draggable: true,
  defining: true,
  priority: 300,

  addAttributes() {
    return {
      imageSrc: {
        default: null,
        parseHTML: (element) => {
          const img = element.querySelector("img");
          return img ? img.src : null;
        },
      },
      imageAlt: {
        default: null,
        parseHTML: (element) => {
          const img = element.querySelector("img");
          return img ? img.alt : null;
        },
      },
      title: {
        default: null,
        parseHTML: (element) => {
          const title = element.querySelector("div.isomer-card-title");
          return title ? title.textContent : null;
        },
      },
      description: {
        default: null,
        parseHTML: (element) => {
          const description = element.querySelector(
            "div.isomer-card-description"
          );
          return description ? description.textContent : null;
        },
      },
      linkText: {
        default: null,
        parseHTML: (element) => {
          const link = element.querySelector("div.isomer-card-link");
          return link ? link.textContent : null;
        },
      },
      linkHref: {
        default: null,
        parseHTML: (element) => {
          const link = element.querySelector("a.isomer-card");
          return link ? link.getAttribute("href") : null;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: ".isomer-card",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});
