import type { Dictionary } from "./ko";

/** 화면 고정 문구 (영어). ko.ts 와 같은 키를 가져야 합니다. */
export const en: Dictionary = {
  meta: {
    description:
      "cciD is a human-centered design center that researches and designs user experiences through computational design and generative AI.",
  },
  nav: {
    about: "About",
    research: "Research",
    projects: "Projects",
    people: "People",
    lab: "Lab",
  },
  footer: {
    people: "People",
    research: "Research",
    /** People 페이지의 그룹으로 이동하는 링크 */
    peopleLinks: {
      director: "Director",
      advisory_board: "Advisors",
      researcher: "Researchers",
      alumni: "Alumni",
    },
  },
  language: {
    switchLabel: "한국어로 전환",
  },
  common: {
    loading: "Loading…",
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  home: {
    research: "Research",
    projects: "Projects",
    viewAll: "View all",
    partners: "Partners",
  },
  about: {
    title: "About",
    lead: "cciD brings user research, generative AI, and interaction design into a single process. We define the experience technology should create within products and brands, then build it ourselves.",
    body: "Our work spans next-generation UI and emotional UX with Samsung Electronics, AI-integrated in-house design processes with Hyundai Motor Group, and turning AI visions into spatial experiences with LG Electronics. With Lotte, we are now approaching the holding company’s AX (AI transformation) from a brand perspective. cciD brings together Carnegie Mellon’s Computational Design Thinking and MIT’s Demo or Die.",
    capabilitiesTitle: "What we do",
    capabilities: [
      {
        name: "Design Strategy",
        description:
          "We develop strategic frameworks that anticipate future user needs, technological shifts, and systemic transformations. By integrating research, speculative prototyping, and AI-driven foresight, we shape design methodologies that drive innovation at the intersection of human experience, emerging technology, and business impact.",
      },
      {
        name: "Human-centered Design",
        description:
          "Our work is rooted in designing for human needs, behaviors, and ethics. We explore user-centered and systemic approaches to crafting digital and physical interactions, leveraging AI and data insights to enhance accessibility, adaptability, and engagement in emerging technologies.",
      },
      {
        name: "Experience Design",
        description:
          "We design multi-sensory, context-aware experiences that foster meaningful engagement. Through the lens of cognitive science, behavioral insights, and interaction modeling, we craft seamless, adaptive, and immersive user journeys across digital ecosystems.",
      },
      {
        name: "Interaction Design",
        description:
          "We define how users interact with digital environments by designing intuitive behaviors, real-time system responses, and adaptive feedback loops. Our research-driven approach explores new interaction paradigms that extend beyond traditional interfaces, shaping the future of interactive systems.",
      },
      {
        name: "Generative AI",
        description:
          "We investigate how AI augments creativity, design workflows, and user interactions. From generative design tools to AI-assisted prototyping, we explore new forms of human-machine collaboration that push the boundaries of computational creativity and adaptive experiences.",
      },
      {
        name: "AR/VR/XR Design",
        description:
          "Extended reality is reshaping perception, presence, and interaction. We design spatial computing experiences that redefine engagement in digital and hybrid spaces, experimenting with immersive storytelling, real-time interaction, and human-centered spatial interfaces.",
      },
      {
        name: "Conversational Design",
        description:
          "We design AI-powered dialogue systems that enable natural, context-aware, and ethical human-machine interactions. By integrating natural language processing, multimodal interfaces, and behavioral insights, we push the boundaries of intelligent conversational experiences.",
      },
      {
        name: "Data Visualization",
        description:
          "We transform complex data into interactive, insightful, and visually compelling narratives. Our research explores new techniques in computational visualization, dynamic storytelling, and AI-assisted data interpretation to enhance decision-making and user comprehension.",
      },
      {
        name: "Interface Design",
        description:
          "We craft the tangible layer of interaction, designing interfaces that balance usability, aesthetics, and adaptive intelligence. Our work integrates real-time data, responsive systems, and AI-driven personalization to create fluid, dynamic user interfaces.",
      },
      {
        name: "Prototyping",
        description:
          "Prototyping is central to our iterative design process. From rapid digital simulations to high-fidelity functional models, we develop experimental prototypes that validate concepts, test interactions, and explore speculative futures in human-computer interaction.",
      },
    ],
  },
  join: {
    eyebrow: "Recruitment",
    title: "We’re curious about your perspective.",
    description:
      "Explore information about internships and opportunities at cciD.",
    cta: "Opportunities at cciD",
    closedTitle: "We’re not recruiting right now",
  },
  research: {
    title: "Research",
    description:
      "The questions each research area asks, and the work that follows them.",
    keywords: "Focus areas",
    projects: "Projects",
    images: "Images",
    others: "More research",
    more: "Learn more",
  },
  projects: {
    title: "Projects",
    description:
      "Projects with industry and public partners, collected by year.",
    all: "All",
    filterLabel: "Filter by research area",
  },
  project: {
    year: "Year",
    title: "Project",
    client: "Organization",
    themes: "Research",
    nda: "NDA",
    empty: "No published projects yet.",
    open: "Details",
    close: "Close",
    research: "Related research",
    ndaNote: "This project is under NDA, so only basic details are shown.",
  },
  people: {
    title: "People",
    profile: "Read full bio",
    categories: {
      director: "Director",
      advisory_board: "Advisory Board",
      former_advisor: "Former Advisors",
      researcher: "Student Researchers",
      intern: "Research Interns",
      alumni: "Alumni",
    },
  },
  lab: {
    title: "Lab",
    eyebrow: "Coming soon",
    lead: "New stories from cciD will be available soon.",
    description:
      "We’re gathering the prototypes, tools, and small experiments in progress at the lab. Opening soon.",
    research: "Explore research",
  },
  notFound: {
    title: "Page not found",
    description: "The page may have moved or no longer exists.",
    home: "Back to home",
  },
};
