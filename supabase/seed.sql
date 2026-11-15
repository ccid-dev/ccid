-- 초기 데이터: 기존 사이트(c-c-i-d.kr) 내용을 옮긴 것입니다. (`supabase db reset` 시 마이그레이션 다음에 실행)
-- 비어 있는 칸(구성원 한글 이름, 일부 프로젝트 한글 설명 등)은 기존 사이트에도 없던 내용입니다. admin 에서 채웁니다.
-- 이미지: 분야는 기존 public/img 경로를 R2 키로 그대로 두었고(업로드 필요), 구성원 사진은 기존 Google Drive 주소입니다.

-- 리서치 분야
insert into public.themes (number, slug, title_ko, title_en, question_ko, question_en, summary_ko, summary_en, catchphrase_ko, catchphrase_en, description_ko, description_en, keywords_ko, keywords_en, images, image_alt_ko, image_alt_en, is_published) values
  (1, 'interfaces', '차세대 사용자 인터페이스', 'Future interfaces', '인터페이스가 우리를 이해한다면,
무엇이 달라질까요?', 'What changes when an interface
understands us?', 'Gen UI의 설계 원칙부터 삼성의 모바일과 TV, 현대⁠·⁠기아의 미래 모빌리티까지. 사용자의 의도를 실제로 작동하는 인터페이스로 연결합니다.', 'From Gen UI principles to Samsung’s mobile and TV, and future mobility for Hyundai and Kia. We translate user intent into working interfaces.', '인터페이스의 다음 형태를
작동하는 시스템으로.', 'The next interface,
as a working system.', '삼성전자의 Generative UI 연구에서는 사용자 맥락과 의도, 디바이스와 작업 흐름에 대응하는 프레임워크를 다뤘습니다. Gen UI 원칙, 로직 파이프라인, 인터랙티브 프로토타입을 연결하며 인터페이스가 생성되고 변화하는 방식을 설계합니다.', 'Our Generative UI work with Samsung Electronics addresses user context, intent, devices, and task flows. We connect Gen UI principles, logic pipelines, and interactive prototypes to design how interfaces are generated and how they adapt.', '{}'::text[], array['Generative UI', 'Adaptive interfaces', 'Multimodal interaction'], array['img/2026/samsung-gen-ui.webp', 'img/2025/mx_galaxy_ai_0.webp', 'img/2025/kia_0.webp', 'img/2025/kia_1.webp'], '생성형 사용자 인터페이스의 개념 이미지', '', true),
  (2, 'creative-intelligence', '인간과 AI의 창의적 협업', 'Creative intelligence', 'AI와 함께 만드는 일은
어떻게 달라질까요?', 'How does making change
when we create with AI?', '현대자동차그룹의 내재화된 AI 디자인 파이프라인과 산자부 R&D 생성형 AI 워크플로우. 생성, 리뷰, 판단을 하나의 프로세스로 설계합니다.', 'An in-house AI design pipeline for Hyundai Motor Group and a generative AI workflow for MOTIE R&D. Connecting generation, review, and judgment in one process.', '생성에서 판단까지,
디자인 프로세스를 다시 설계합니다.', 'From generation to judgment.
Redesigning the design process.', 'AI 도입의 설계 단위는 팀의 작업 과정 전체입니다. 현대자동차그룹과의 연구에서는 컨셉 탐색, 디자인 리뷰, 평가를 연결하는 워크플로우를 다뤘습니다. 생성형 탐색과 3D 재구성, 디자이너의 검토를 연결해 AI가 실제 디자인 프로세스 안에서 작동하도록 설계합니다.', 'We design AI adoption at the scale of a team’s entire workflow. Our work with Hyundai Motor Group connects concept exploration, design review, and evaluation, bringing generative exploration, 3D reconstruction, and designer judgment into the design process.', '{}'::text[], array['Human–AI collaboration', 'Generative workflows', 'Design tools'], array['img/2025/hd_ai_driven_design.webp', 'img/2026/hd-design-axes.webp', 'img/2025/motie_2.webp', 'img/2025/motie_1.webp'], 'AI 기반 디자인 탐색 프로세스의 개념 이미지', '', true),
  (3, 'spatial-experiences', '공간과 일상의 새로운 경험', 'Spatial experiences', '기술이 공간을 만나면,
어떤 경험이 시작될까요?', 'What begins when technology
becomes part of a place?', 'LG의 고객과 공감하는 AI 경험, COEX의 공공 AI 인터페이스, 현대차 정몽구 재단과 《Shared World》 기획전, 자하 하디드 아키텍츠와 함께한 DDP 45133 브랜딩과 전시까지. 브랜드의 비전을 공간 경험으로 구현합니다.', 'From an AI experience that empathizes with LG’s customers, a public AI interface at COEX, and the Shared World exhibition with the Hyundai Motor Chung Mong-Koo Foundation to the DDP 45133 brand and exhibition with Zaha Hadid Architects. Translating brand visions into spatial experiences.', '브랜드의 비전이
사람의 경험이 되는 순간.', 'When a brand’s vision
becomes a lived experience.', '공간은 브랜드와 기술이 직접 경험되는 접점입니다. LG의 Affectionate Intelligence를 전하는 금성전파사와, COEX 미디어 파사드를 공공 AI 인터페이스로 재해석한 GangnamEyes에서는 스토리텔링, 생성형 미디어, 참여형 시스템을 연결해 각 장소에 맞는 인터랙션을 설계했습니다. 서울디자인재단과는 자하 하디드 아키텍츠와 협력해 DDP 45133의 브랜드와 런칭 전시를 만들고, 디지털 트윈 기반의 DDP 멤버십 컨셉까지 설계했습니다. 현대차 정몽구 재단 온드림 소사이어티의 《Shared World》는 한국예술종합학교 미술원 CRAFT Lab과 cciD가 함께 만든 전시입니다.', 'Space is where people experience a brand and its technology directly. From Geumseong Electronics for LG’s Affectionate Intelligence to GangnamEyes at the COEX media facade, we connect storytelling, generative media, and participatory systems into interactions specific to each place. For the Seoul Design Foundation, we created the DDP 45133 brand and its launch exhibition in collaboration with Zaha Hadid Architects, and designed a digital twin-based membership concept for the DDP. Shared World at the Hyundai Motor Chung Mong-Koo Foundation’s ONDREAM SOCIETY is an exhibition made together by CRAFT Lab and cciD at the Korea National University of Arts.', '{}'::text[], array['Spatial interaction', 'Customer experience', 'Participatory systems'], array['img/2026/onso-shared-world.webp', 'img/2025/lg_affectionate_intelligence_0.webp', 'img/2025/lg_affectionate_intelligence_3.webp', 'img/2025/lg_affectionate_intelligence_4.webp', 'img/2025/lg_affectionate_intelligence_5.webp', 'img/2025/coex_0.webp', 'img/2025/coex_1.webp', 'img/2025/coex_2.webp', 'img/2025/ddp_0.webp', 'img/2025/ddp_1.webp', 'img/2025/ddp_2.webp', 'img/2025/ddp_3.webp', 'img/2025/ddp_4.webp', 'img/2025/ddp_5.webp', 'img/2025/ddp_6.webp'], 'LG Affectionate Intelligence 공간 경험 이미지', '', true),
  (4, 'human-understanding', '사람을 이해하는 디자인', 'Human understanding', '사람의 경험을 이해하는
더 깊은 방법은 무엇일까요?', 'How can we understand
experience more deeply?', '삼성 TV의 감성 품질과 미래 모빌리티의 AI UX. 사람에 대한 리서치를 제품과 브랜드의 디자인 판단으로 연결합니다.', 'Emotional quality for Samsung TV. AI UX for future mobility. Turning human research into design decisions for products and brands.', '사람에 대한 이해를,
디자인의 판단 근거로.', 'Human understanding.
A basis for design decisions.', '리서치는 디자인의 방향을 결정할 수 있어야 합니다. 삼성전자 VD와는 감성 품질과 삼성다움을 평가하고, 북미 Smart TV 경험을 정성적으로 분석했습니다. 사용자 행동과 감정의 차이를 읽는 언어와 평가 기준을 만들어, 제품 경험과 브랜드의 방향을 구체화합니다.', 'Research needs to inform design direction. With Samsung Electronics VD, we evaluated emotional quality and Samsung-ness and investigated Smart TV experiences in North America. We develop vocabulary and criteria that connect human behavior and feeling to product and brand decisions.', '{}'::text[], array['Qualitative research', 'Emotional evaluation', 'Design strategy'], array['img/2025/vd_23_0.webp', 'img/2025/vd_0.webp', 'img/2025/vd_1.webp', 'img/2025/vd_2.webp'], 'Smart TV 사용자 경험 연구의 개념 이미지', '', true);

-- 프로젝트
insert into public.projects (title_ko, title_en, client_ko, client_en, year_start, tags_ko, tags_en, description_ko, description_en, sort_order, is_published) values
  ('AI 기반 2D–3D 통합 설계전환 체계 및 내재화 핵심기술 개발', 'AI Design Workflow from 2D to 3D for In-house Studios', '현대자동차그룹', 'Hyundai Motor Group', 2026, array['AI 디자인 워크플로우', '3D 재구성', '의사결정 지원'], array['AI design workflows', '3D reconstruction', 'Decision support'], '보안이 요구되는 사내 환경에서 생성형 탐색, 3D 재구성, 디자이너 리뷰를 디자인 프로세스에 통합하는 연구입니다.', 'Secure in-house AI-assisted design workflow embedding generative exploration, 3D reconstruction, designer review, and decision support into the design process.', 0, true),
  ('생성형 사용자 인터페이스 연구', 'Generative User Interface', '삼성전자 CDO', 'Samsung Electronics CDO', 2026, array['Gen UI 원칙', '로직 파이프라인', '인터랙티브 프로토타입'], array['Gen UI principles', 'Logic pipelines', 'Interactive prototypes'], 'AI 네이티브 경험을 위한 생성형 UI 프레임워크. 사용자 맥락과 의도에 따라 인터페이스가 적응하는 원칙과 구조를 설계합니다.', 'Generative UI framework for AI-native experiences, enabling interfaces to adapt across user context, intent, device ecosystem, and task flow through GenUI principles, logic pipelines, and interactive prototypes.', 1, true),
  ('SDV를 위한 사용자 의도 기반 적응형 GenUI', 'Intent-Based Adaptive GenUI for SDV', '제로원 ZER01NE', 'ZER01NE', 2026, '{}'::text[], '{}'::text[], '', 'A generative UI that adapts to driver intent in software-defined vehicles, developed through the ZER01NE Sprint program.', 2, true),
  ('Generative UI 디자인 프로세스 및 사용자 경험 가치 검증', 'Generative UI Process & UX Value Validation', '삼성전자 CDO', 'Samsung Electronics CDO', 2026, '{}'::text[], '{}'::text[], '', 'Defining a Generative UI design process and validating the user experience value it creates.', 3, true),
  ('AI TV Flexible UI 구성 원칙 및 Adaptive Interaction 연구', 'AI TV Flexible UI Principles & Adaptive Interaction', '삼성전자 VD', 'Samsung Electronics VD', 2026, '{}'::text[], '{}'::text[], '', '', 4, true),
  ('Affectionate Intelligence 고객 경험 디자인', 'Affectionate Intelligence CX Design', 'LG전자', 'LG Electronics', 2025, array['브랜드 경험', '공간 CX', '참여형 인터랙션'], array['Brand experience', 'Spatial CX', 'Participatory interaction'], 'LG의 Affectionate Intelligence 비전을 금성전파사라는 몰입형 공간 경험으로 전개했습니다. 스토리텔링, 인터랙티브 시스템, 미디어 아트와 관객 참여를 통합했습니다.', 'Public AI brand experience translating LG’s Affectionate Intelligence vision into Geumseong Electronics, an immersive spatial CX platform combining storytelling, interactive systems, media art, and participatory engagement.', 0, true),
  ('AI 에이전트 기반 공공 공간 인터랙션', 'AI-Driven AR Interaction Platform', 'CJ CGV · 네이버클라우드', 'CJ CGV & Naver Cloud', 2025, array['공공 AI 인터페이스', '생성형 콘텐츠'], array['Public AI interface', 'Generative content'], 'COEX K-POP Square 미디어 파사드를 도시 규모의 AI 인터페이스로 재해석한 GangnamEyes. AI 인프라와 미디어 운영, 생성형 콘텐츠, 관객 참여를 연결했습니다.', 'Design of GangnamEyes, a public AI agent experience that reimagines the COEX K-POP Square media facade as an urban-scale AI interface, combining Naver Cloud’s AI infrastructure, CJ CGV’s media operations, generative content, audience participation, and K-POP-specific interaction grammar.', 1, true),
  ('생성형 AI 기반 외장 디자인 프로세스 연구', 'AI-Driven Exterior Design Process', '현대자동차그룹', 'Hyundai Motor Group', 2025, array['외장 디자인', '글로벌 디자인 협업'], array['Exterior design', 'Global design collaboration'], '글로벌 디자인센터 간 커뮤니케이션을 위한 AI 기반 외장 디자인 워크플로우. 컨셉 탐색부터 리뷰와 평가까지 공동 의사결정의 흐름으로 연결했습니다.', 'AI-augmented exterior design workflow that brings generative AI into the design process to raise communication efficiency across Hyundai''s global design centers, connecting concept exploration, design review, and evaluation into a faster, shared decision-making loop.', 2, true),
  ('AI 기반 창작 도구 및 생성 파이프라인 연구', 'AI Design Generation Pipeline', '산업통상자원부', 'Ministry of Trade, Industry and Energy', 2025, array['맥락 기반 생성', '이미지–3D 파이프라인'], array['Contextual generation', 'Image-to-3D pipeline'], '채팅의 감정·행동·상황을 해석하는 Contextual Emoji Asset 시스템과 이미지 기반 3D 생성 파이프라인을 다루는 국가 R&D 과제입니다.', 'National R&D program building AI-assisted creative infrastructure, including a Contextual Emoji Asset system that uses an LLM to read the emotion, action, and situation in a user''s chat and generate real-time context-tailored emojis, extended by an image-based 3D pipeline that turns them into stylized 3D assets.', 3, true),
  ('차세대 대화면 에디터 UX 연구', 'Next-Gen Large-Screen Editor UX Research', '삼성전자 MX', 'Samsung Electronics MX', 2025, array['사용성 조사', '사용자 리서치', 'AI UX 컨셉'], array['Usability research', 'User research', 'AI UX concepts'], '차세대 대화면 에디터를 위한 사용성 조사와 MZ 세대 리서치. 사용자의 편집 행동을 제품 경험의 방향과 AI 컨셉으로 연결했습니다.', 'AI UX research and concept development for next-generation large-screen mobile device editor, spanning usability research and MZ-generation user research, translating user behavior and editing workflows into future product experience directions.', 4, true),
  ('감성 품질 평가 및 삼성다움 연구', 'Samsung-ness Emotional Quality Research', '삼성전자 VD', 'Samsung Electronics VD', 2024, array['감성 품질 평가', '브랜드 경험 전략'], array['Emotional quality evaluation', 'Brand experience strategy'], '감성 평가 방법론으로 양산을 앞둔 차세대 제품 UX의 여러 디자인 방향을 검증하고, 브랜드의 고유성과 가치를 높이는 안을 선별해 최종 결정을 이끌었습니다.', 'Emotional quality assessment and Samsung-ness research that uses sensory evaluation to chart the future direction of the Samsung brand and to drive production-bound design decisions for next-generation TV UX.', 0, true),
  ('2030 e-MPV 선행 내장 AI UX 연구', '2030 e-MPV Interior AI UX Research', '기아', 'KIA', 2024, array['선행 UX', '컨셉 프레임워크'], array['Advanced UX', 'Concept framework'], '2030 e-MPV 내장 경험을 위해 Smart, Care, Trust의 핵심 프레임워크를 정의하고, 세 요소의 관계에서 미래 모빌리티 컨셉을 도출했습니다.', 'Advanced AI UX concept research for the 2030 e-MPV interior, where cciD defined the smart, care, and trust framework at its core and developed future mobility concepts from the interrelation between them.', 1, true),
  ('Smart TV 감성 UX 평가', 'Smart TV UX Emotional Evaluation', '삼성전자 VD', 'Samsung Electronics VD', 2023, array['북미 사용자 리서치', '감성 UX 평가'], array['North American user research', 'Emotional UX evaluation'], '북미 시장의 Smart TV 경험을 다이어리 스터디와 정성 조사로 분석했습니다. Lean-forward·lean-back 경험을 살피며 감성 UX 어휘와 평가 방법론을 정립했습니다.', 'Establishing an emotional design strategy for Smart TV in the North American market through qualitative research, including diary studies and an inquiry into lean-forward and lean-back viewing experiences, paired with an emotional UX vocabulary and evaluation methodology.', 0, true),
  ('DDP 45133 브랜딩 및 디지털 트윈 서비스', 'DDP 45133 Branding & Digital Twin Service', '서울디자인재단', 'Seoul Design Foundation', 2023, array['브랜딩', '전시 큐레이션', '디지털 트윈'], array['Branding', 'Exhibition curation', 'Digital twin'], '서울디자인재단의 DDP 45133 브랜딩을 맡아 자하 하디드 아키텍츠와 협력한 런칭 전시를 큐레이션하고, 브랜드 전략의 핵심인 디지털 트윈 기반 DDP 멤버십 컨셉을 설계했습니다.', 'DDP 45133 branding by cciD, curation of a launch exhibition in collaboration with Zaha Hadid, and, as the core of the brand strategy, the concept design of a new digital twin-based membership system for the DDP.', 1, true),
  ('Melting Point 몰입형 브랜드 경험', 'Melting Point: Immersive Installation', '롯데 · 하겐다즈', 'Lotte & Häagen-Dazs', 2022, '{}'::text[], '{}'::text[], '', 'Generative digital installation created with Lotte Museum and Häagen-Dazs to elevate the brand experience, translating the brand''s flavor, texture, and temperature into an algorithmic, immersive spatial narrative.', 0, true);

-- 분야 ↔ 프로젝트 (position 0 = 주 분야)
insert into public.project_themes (project_id, theme_id, position)
select p.id, t.id, v.position from (values
  ('AI Design Workflow from 2D to 3D for In-house Studios', 'creative-intelligence', 0),
  ('Generative User Interface', 'interfaces', 0),
  ('Intent-Based Adaptive GenUI for SDV', 'interfaces', 0),
  ('Generative UI Process & UX Value Validation', 'interfaces', 0),
  ('Generative UI Process & UX Value Validation', 'human-understanding', 1),
  ('AI TV Flexible UI Principles & Adaptive Interaction', 'interfaces', 0),
  ('Affectionate Intelligence CX Design', 'spatial-experiences', 0),
  ('AI-Driven AR Interaction Platform', 'spatial-experiences', 0),
  ('AI-Driven AR Interaction Platform', 'interfaces', 1),
  ('AI-Driven Exterior Design Process', 'creative-intelligence', 0),
  ('AI Design Generation Pipeline', 'creative-intelligence', 0),
  ('AI Design Generation Pipeline', 'interfaces', 1),
  ('Next-Gen Large-Screen Editor UX Research', 'interfaces', 0),
  ('Next-Gen Large-Screen Editor UX Research', 'human-understanding', 1),
  ('Samsung-ness Emotional Quality Research', 'human-understanding', 0),
  ('2030 e-MPV Interior AI UX Research', 'interfaces', 0),
  ('2030 e-MPV Interior AI UX Research', 'human-understanding', 1),
  ('Smart TV UX Emotional Evaluation', 'human-understanding', 0),
  ('DDP 45133 Branding & Digital Twin Service', 'spatial-experiences', 0),
  ('Melting Point: Immersive Installation', 'spatial-experiences', 0)
) as v (title_en, slug, position)
join public.projects p on p.title_en = v.title_en
join public.themes t on t.slug = v.slug;

-- 구성원 (기존 사이트는 영문만 있었습니다)
insert into public.people (category, name_en, role_en, bio_en, profile_en, image, sort_order, is_published) values
  ('director', 'Kyuha Shim, FRSA', 'Professor of Design at
Korea National University of Arts', 'formerly
Carnegie Mellon University. Associate Professor
Meta(Facebook). Designer-in-Residence
Jan van Eyck Academie. Researcher
MIT Senseable City Lab. Research Fellow', 'Kyuha Shim is a practicing designer and design leader working across AI, product experience, emerging technology, and organizational strategy. His work explores how design should shape relationships among people, artifacts, and systems, defining when technology should assist, act autonomously, or defer to human judgment.

He is tenured Full Professor of Design at Korea National University of Arts and Founding Director of the Center for Creative Intelligence Design (cciD), established in 2023. He leads a multidisciplinary team of more than twenty UX researchers, design strategists, interaction and visual designers, and creative technologists, connecting advanced research with industry execution. Through cciD, he works with Samsung, Hyundai, LG, and NAVER, alongside national research programs and public-sector partners including the Seoul Metropolitan Government and Seoul Design Foundation.

Shim has worked with generative systems for human experience since 2008. His practice spans next-generation user interfaces, agent-based communication, affective design engineering, AI-supported design workflows, and product strategy.

Previously, he spent seven years at Carnegie Mellon University as Associate Professor of Design and Director of the Computational Creativity Lab, leading government-funded research and serving as Creative Director on industry collaborations.

Earlier, he was a Research Fellow at MIT SENSEable City Lab and a designer-in-residence at Facebook now Meta. He earned an MFA at RISD (Rhode Island School of Design), where he later taught, and conducted doctoral research in Communication Design at RCA (Royal College of Art), where he also served as a Visiting Lecturer.

Shim guest-edited and designed GRAPHIC #37: Introduction to Computation (2016), organized and chaired Computational Design Practices (2021) for AIGA’s Design Educators Community, and computationally designed Code as Creative Medium (2021) for MIT Press before translating it into Korean. He also co-authored Future Lab (2026) and translated Design Futuring (2026) into Korean, exploring design’s changing role and the futures it helps create.

He completed an Executive MBA at Aalto University, focusing on business design and brand authenticity in the age of generative AI. His work has been exhibited at LACMA, Cooper Hewitt, SIGGRAPH, and MMCA Korea, and recognized by Adobe, AIGA, Core77, Red Dot, iF, and TDC.

He builds teams that connect research, technology, and design to define product direction, create coherent experiences, and develop the organizational capabilities to deliver them.', 'https://drive.google.com/thumbnail?id=1czD9OPBqk91vPq_34dl2Hdr6-x3o1dTh&sz=w1000', 0, true),
  ('advisory_board', 'Taery Kim', 'Design Strategy', 'King''s College London PhD
Carnegie Mellon University MA
former Zenda Asia. Managing Director', '', 'https://drive.google.com/thumbnail?id=1-fcBAtkg4l-fLMW0ufyZYF7zwjLww7tb&sz=w1000', 0, true),
  ('advisory_board', 'Ingee Jeong', 'Visual Interaction', 'Royal College of Art MA
Visual Communication
former Ordinary People', '', '', 1, true),
  ('advisory_board', 'Yoonha Jeong', 'User Experience Design', 'Korea National University of Arts MFA
Interaction Design
former d''strict, SK Telecom UX', '', '', 2, true),
  ('advisory_board', 'Kiryung Nam', 'Generative AI for Interactive Media', 'Royal College of Art MA
Information Experience Design
former Art Korea Lab. Gen AI Lab Director', '', 'https://drive.google.com/thumbnail?id=1vPALXgTqlGki-T4dnWr4IOjPgPHJhmCs&sz=w1000', 3, true),
  ('advisory_board', 'Chanwoo Lee', 'System Interface Architecture', 'Imperial College London MSc
Innovation Design Engineering', '', '', 4, true),
  ('advisory_board', 'Seonbin Yun', 'Data-driven Design', 'Royal College of Art MA
Information Experience Design', '', '', 5, true),
  ('former_advisor', 'Boram Lee', 'Design Thinking', 'Goldsmiths PhD 
Mobile Experience Design', '', 'https://drive.google.com/thumbnail?id=1Wfiy1pPqjmuxX0-wLaBJ_mrKthVDv5df&sz=w1000', 0, true),
  ('former_advisor', 'Jiyeon Lee', 'Speculative Design', 'KAIST PhD (ABD)
Domus Academy MA
former Samsung Electronics. UX Designer', '', 'https://drive.google.com/thumbnail?id=1XnOm3hJUP6HO3Jc6azQv5O52B65aXj0Z&sz=w1000', 1, true),
  ('former_advisor', 'Yunhyeong Park', '', 'Royal College of Art MA
Information Experience Design
Samsung Electronics AI Creative Director', '', 'https://drive.google.com/thumbnail?id=1QCYqrja1JdQxiC-T3VQYBQvyFSlyB-Av&sz=w1000', 2, true),
  ('former_advisor', 'Hankak Lee', '', 'Royal College of Art MA
Innovation Design Engineering
Professor of Industrial Design, Keimyung University', '', '', 3, true),
  ('former_advisor', 'Changmin Kim', '', 'former KAIST Postdoc
Professor of Design, Sungkyunkwan University', '', '', 4, true),
  ('researcher', 'Juwan Kim', '', 'MDes ''25
Exploring opportunities in digital design and generative AI.', '', 'https://drive.google.com/thumbnail?id=1qc6KAHzyQBk6Q9Fbv6hI3YnCNs6RywjO&sz=w1000', 0, true),
  ('researcher', 'Juhae Kim', '', 'Service Design
Data Visualization', '', 'https://drive.google.com/thumbnail?id=1abzaNf1yVqCLEUuifiMf7HUUMCmVmPpV&sz=w1000', 1, true),
  ('researcher', 'Hyebin Park', '', 'Interaction Design
User Experience Design', '', 'https://drive.google.com/thumbnail?id=1VEL6mIQCNP_yCtRchoEdteNFVKFpfb5n&sz=w1000', 2, true),
  ('researcher', 'Suhyeon Cho', '', 'Design Strategy
Interaction Design
Generative AI', '', 'https://drive.google.com/thumbnail?id=1rU6bZKvPxSDfu1EXpo7g1KZTLCtWHa8N&sz=w1000', 3, true),
  ('researcher', 'Minseo Kang', '', 'UX/UI Design
Interaction Design
Generative AI', '', 'https://drive.google.com/thumbnail?id=1z-A5cfWIqHAybgcqaoo5Y4Wrn8DyMoc1&sz=w1000', 4, true),
  ('researcher', 'Sooyoun Jo', '', 'Interaction Design
User Experience Design
Prototyping', '', 'https://drive.google.com/thumbnail?id=1yBMkw94qC0oO_aww1DeJFJ6C7QLgednJ&sz=w1000', 5, true),
  ('researcher', 'Hyunji Lee', '', 'Design Strategy
User Experience Design
Interaction Design', '', 'https://drive.google.com/thumbnail?id=1geRCTuicomKdZVGay12MRo4VM2eZ2P8I&sz=w1000', 6, true),
  ('researcher', 'Jiyu Shin', '', 'User Experience Design
Interface Design', '', 'https://drive.google.com/thumbnail?id=1_x59n2MuDomoCMBDoL4bX6E0j5WcAyst&sz=w1000', 7, true),
  ('researcher', 'Taeeun Kim', '', 'User Experience Design
Interface Design', '', 'https://drive.google.com/thumbnail?id=16gpanmqFjtOv2FbVJuZ2xDmYMSZ0fbwj&sz=w1000', 8, true),
  ('researcher', 'Seojin Hong', '', 'Interface Design
Data Visualization
Generative AI', '', 'https://drive.google.com/thumbnail?id=1gftGmFrFaND7VUkezC61YuAHdlCJQYb6&sz=w1000', 9, true),
  ('researcher', 'Minjeong Joo', '', 'User Experience Design
Interface Design
Generative AI', '', 'https://drive.google.com/thumbnail?id=15jN1JLiBdCgpSehtKY8ph2nBRKm4wKM9&sz=w1000', 10, true),
  ('researcher', 'Hyosun Son', '', 'Design Strategy
User Experience Design
Conversational Design', '', '', 11, true),
  ('researcher', 'Hayeon Jeon', '', 'Service Design 
Interface Design', '', '', 12, true),
  ('researcher', 'Sara Kang', '', 'UX/UI Design 
Interaction Design', '', 'https://drive.google.com/thumbnail?id=1TJZHZ0jgmnk_tujM9bMdOaHuR-aiaJ2f&sz=w1000', 13, true),
  ('researcher', 'Da in Kim', '', 'Conversational Design
Interface Design', '', '', 14, true),
  ('intern', 'Yunso Jung', '', 'Physical Intelligence
Experimental Interface', '', '', 0, true),
  ('intern', 'Heeyun Sul', '', 'Interaction Design
Prototyping', '', 'https://drive.google.com/thumbnail?id=1siPNJzRUaZK-RNh1ZrGzZbvWj13p2qpd&sz=w1000', 1, true),
  ('intern', 'Yeju Chung', '', 'Service Design
UX/UI Design
User Experience Design', '', 'https://drive.google.com/thumbnail?id=1qSuq30xQdBHnyD4OGfgYx5UT6sCpMRZP&sz=w1000', 2, true),
  ('intern', 'Chaeyeon Kang', '', '', '', '', 3, true),
  ('intern', 'Yerin Choi', '', '', '', '', 4, true),
  ('alumni', 'Minji Park', '', 'BDes ''25
Samsung Electronics. UX Designer.', '', 'https://drive.google.com/thumbnail?id=1pfpR5aWayiLKWE0xxapp-_zSnvIrLq1R&sz=w1000', 0, true),
  ('alumni', 'Seungju Lee', '', 'BDes ''25
RCA Design Futures. MDes Candidate.', '', 'https://drive.google.com/thumbnail?id=1sNTwHHH-Yrsdg09jXbP8B7fUtKHLjJA6&sz=w1000', 1, true),
  ('alumni', 'Euna Jang', '', 'BDes ''25
KAIST CT. MSc Candidate.', '', 'https://drive.google.com/thumbnail?id=1uVtsW4D8Dwo44Y4uw4P0GtmD1tUwOdRP&sz=w1000', 2, true),
  ('alumni', 'Jiwon Park', '', 'BDes ''26
ECAL. MDes Candidate.', '', 'https://drive.google.com/thumbnail?id=1UOr8iGINhXF2RXlcvpodPxzH7LvyHEmg&sz=w1000', 3, true),
  ('alumni', 'Inyoung Kim', '', 'MDes ''25
Exploring opportunities in digital design planning and media art.', '', 'https://drive.google.com/thumbnail?id=1YfKG7-EUwY35mrizrA8DC9TSYLFe1QjP&sz=w1000', 4, true),
  ('alumni', 'Yoonseo Oh', '', 'BDes ''26
Exploring opportunities in AI XR experience and digital product design.', '', 'https://drive.google.com/thumbnail?id=1vy19ZT6pFLyPQn_DmuqANg3RJCFTCyjU&sz=w1000', 5, true),
  ('alumni', 'Hyeji Jeong', '', 'BDes ''26
Exploring opportunities in user experience design.', '', 'https://drive.google.com/thumbnail?id=1j6UUGvB20je3NApKK7MvS0XGWhx71FLO&sz=w1000', 6, true);
