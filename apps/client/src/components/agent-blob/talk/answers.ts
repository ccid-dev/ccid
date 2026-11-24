// 자주 나올 질문에 미리 정해 둔 대답. 서버(에이전트 규칙)와 화면(추천 질문 버튼)이 같이 씁니다.
// 사이트에 공개된 내용만 담습니다 — 비밀값이 아니라 브라우저에 실려도 괜찮습니다.
//
// - 서버: 작업 · 역량 · 팀에 대해서는 에이전트가 이 대답을 쓰고(줄이거나 물은 부분만 답할 수는 있어도) 새 사실을 보태지 않습니다.
// - 화면: SUGGESTIONS 의 버튼을 누르면 OpenAI 를 부르지 않고 이 대답을 바로 보여 줍니다(비용 0).
//
// 예전 사이트(answers.js)에서 그대로 옮겼습니다. 지금 사이트와 맞는지 검토가 필요합니다:
// 팀 인원("스무 명이 넘어요"), 협력 기업 목록, 연락처. 고치면 다음 대화부터 바로 반영됩니다.

export interface Answer {
  id: string;
  /** 이런 질문일 때 (모델이 알아보는 용도, 두 언어) */
  when: string;
  ko: string;
  en: string;
}

export const ANSWERS: Answer[] = [
  {
    id: "about",
    when: "What is cciD? / cciD는 어떤 곳인가요?",
    ko: "cciD는 한국예술종합학교에 있는 디자인 센터예요. 컴퓨테이셔널 디자인과 생성형 AI로 사용자 경험을 연구하고, 그 경험을 직접 만들어요.",
    en: "cciD is a design center at Korea National University of Arts. We research user experience through computational design and generative AI, and we build what we design.",
  },
  {
    id: "strengths",
    when: "What can cciD do? What are its strengths or capabilities? / 무엇을 잘하나요? 역량이 뭔가요?",
    ko: "사용자 리서치, 생성형 AI, 인터랙션 디자인을 한 흐름으로 이어요. 리서치로 방향을 잡고, 전략과 시스템을 세우고, 실제로 작동하는 프로토타입까지 만들어요.",
    en: "We connect user research, generative AI and interaction design in one process. Research sets the direction, then we build the strategy, the system and a working prototype.",
  },
  {
    id: "research",
    when: "What does cciD research? / 어떤 연구를 하나요?",
    ko: "네 가지를 다뤄요. 차세대 사용자 인터페이스, 인간과 AI의 창의적 협업, 공간과 일상의 새로운 경험, 그리고 사람을 이해하는 디자인이에요.",
    en: "Four areas: next-generation interfaces, human and AI co-creation, spatial and everyday experiences, and design that understands people.",
  },
  {
    id: "clients",
    when: "Who has cciD worked with? / 어떤 회사들과 일했나요?",
    ko: "삼성전자, 현대자동차그룹, 기아, LG전자, 서울디자인재단 같은 기업과 기관, 그리고 국가 R&D 과제와 함께했어요. 전체 목록은 Projects 페이지에 있어요.",
    en: "Samsung Electronics, Hyundai Motor Group, Kia, LG Electronics and the Seoul Design Foundation, along with national R&D programs. The full list is on the Projects page.",
  },
  {
    id: "method",
    when: "How does cciD work? Its approach or method / 어떤 방식으로 일하나요?",
    ko: "CMU의 Computational Design Thinking과 MIT의 Demo or Die를 하나로 이어요. 리서치로 검증하고, 디자인으로 완성해요.",
    en: "We bring together Carnegie Mellon’s Computational Design Thinking and MIT’s Demo or Die. Research-led, design-driven.",
  },
  {
    id: "team",
    when: "Who is on the team? How big is it? / 팀은 누구인가요? 몇 명인가요?",
    ko: "심규하 디렉터와 자문위원, 학생 연구원, 리서치 인턴이 함께해요. UX 리서처, 디자인 전략가, 인터랙션과 비주얼 디자이너, 크리에이티브 테크놀로지스트까지 스무 명이 넘어요. 자세한 건 People 페이지에 있어요.",
    en: "Director Kyuha Shim with advisors, student researchers and research interns: more than twenty UX researchers, design strategists, interaction and visual designers, and creative technologists. They’re all on the People page.",
  },
  {
    id: "director",
    when: "Who leads cciD? Who is the director? / 누가 이끄나요?",
    ko: "심규하 교수가 2023년에 세우고 이끌고 있어요. 한국예술종합학교 디자인과 정교수이고, 그전에는 카네기멜론대학교에서 7년 동안 부교수로 있었어요.",
    en: "Kyuha Shim founded cciD in 2023 and leads it. He is a tenured Full Professor of Design at Korea National University of Arts, and before that spent seven years as an Associate Professor at Carnegie Mellon.",
  },
  {
    id: "who-did",
    when: "Who worked on a particular project? What did a particular member do? / 어떤 프로젝트를 누가 했나요?",
    ko: "누가 어떤 프로젝트에 참여했는지는 사이트에 나와 있지 않아요. 궁금하시면 팀에 물어봐 드릴게요.",
    en: "Who worked on which project isn’t on the site. I can ask the team for you if you like.",
  },
  {
    id: "numbers",
    when: "Project results, budget, duration, numbers / 프로젝트 성과, 비용, 기간",
    ko: "프로젝트의 기간이나 성과, 비용은 사이트에 공개하지 않았어요. 필요하시면 팀에 전해 드릴게요.",
    en: "Project timelines, results and costs aren’t published on the site. I can pass the question to the team.",
  },
  {
    id: "can-do",
    when: "Can cciD do something that is not described on the site? / 사이트에 없는 일을 할 수 있나요?",
    ko: "그 일이 가능한지는 팀이 직접 답하는 게 정확해요. 어떤 일인지 말씀해 주시면 전해 드릴게요.",
    en: "The team can answer that best. Tell me what you have in mind and I’ll pass it on.",
  },
  {
    id: "join",
    when: "Internships, jobs, joining / 인턴, 채용, 참여",
    ko: "인턴십과 참여 기회는 People 페이지 아래의 참여 및 채용 안내에 있어요. 모집 시기 같은 건 사이트에 없어서, 원하시면 팀에 물어봐 드릴게요.",
    en: "Internships and other opportunities are linked at the bottom of the People page. Dates aren’t on the site, so I can ask the team for you.",
  },
  {
    id: "location",
    when: "Where is cciD? / 어디에 있나요?",
    ko: "한국예술종합학교 석관동 캠퍼스에 있어요. 주소는 서울 성북구 화랑로32길 146-37이에요.",
    en: "At Korea National University of Arts, Seokgwan-dong campus: 146-37 Hwarang-ro 32-gil, Seongbuk-gu, Seoul.",
  },
  {
    id: "contact",
    when: "How can I contact cciD? / 연락하려면?",
    ko: "여기서 바로 팀에 메시지를 전해 드릴 수 있어요. 메일은 hello.ccid@gmail.com, 전화는 02-746-9620이에요.",
    en: "I can pass a message to the team right here. Or write to hello.ccid@gmail.com, or call +82 2 746 9620.",
  },
  {
    id: "ai",
    when: "Are you an AI? Can you search the web? / AI인가요? 검색할 수 있나요?",
    ko: "저는 cciD의 AI 안내자예요. 이 사이트에 있는 내용만 알고, 웹 검색은 하지 않아요.",
    en: "I’m cciD’s AI guide. I only know what’s on this website, and I don’t search the web.",
  },
];

/** 추천 질문 버튼. answer 가 있으면 정해 둔 대답을 바로 보여 주고, 없으면 에이전트에게 묻습니다. */
export const SUGGESTIONS: {
  ko: string;
  en: string;
  answer?: Answer["id"];
}[] = [
  { ko: "cciD는 어떤 곳인가요?", en: "What is cciD?", answer: "about" },
  {
    ko: "어떤 연구를 하나요?",
    en: "What do you research?",
    answer: "research",
  },
  { ko: "함께 일하고 싶어요", en: "I’d like to work together" },
];

export const answerById = (id: string) => ANSWERS.find((a) => a.id === id);
