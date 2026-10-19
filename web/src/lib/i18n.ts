export type Locale = "ko" | "en";

export interface Translations {
  // Navigation
  nav_today: string;
  nav_explore: string;
  nav_pipeline: string;
  nav_followups: string;
  nav_portals: string;
  nav_analytics: string;
  nav_cv: string;
  nav_config: string;

  // Home / Today Dashboard
  home_today_tag: string;
  home_all_caught_up: string;
  home_new_matches: string;
  home_followups_due: string;
  home_subtitle_clear: string;
  home_subtitle_action: string;
  home_btn_explore: string;
  home_btn_pipeline: string;
  home_sec_followups: string;
  home_sec_followups_hint: string;
  home_sec_awaiting: string;
  home_sec_awaiting_hint: string;
  home_sec_fresh: string;
  home_sec_fresh_hint: string;

  // Pipeline header & summary
  pipeline_title: string;
  pipeline_subtitle: string;
  search_placeholder: string;
  view_table: string;
  view_grid: string;
  view_kanban: string;
  filter_top_matches: string;
  filter_clear: string;
  filter_score_label: string;
  filter_active_only: string;
  filter_interviews_only: string;
  filter_all_jobs: string;
  pipeline_stages_title: string;
  funnel_conversion: string;

  // Kanban view
  kanban_col_evaluated: string;
  kanban_col_applied: string;
  kanban_col_responded: string;
  kanban_col_interview: string;
  kanban_col_offer: string;
  kanban_col_archived: string;
  kanban_advance_next: string;
  kanban_empty_col: string;

  // Slide-over Quick Detail Drawer
  drawer_title: string;
  drawer_view_report: string;
  drawer_external_posting: string;
  drawer_copy_info: string;
  drawer_copied: string;
  drawer_stage_progress: string;
  drawer_notes: string;
  drawer_no_notes: string;
  score_tier_exceptional: string;
  score_tier_strong: string;
  score_tier_good: string;
  score_tier_moderate: string;

  // Report & Toolkit Tabs
  report_tab_overview: string;
  report_tab_keywords: string;
  report_tab_interview: string;
  report_tab_cover: string;
  report_tab_negotiation: string;
  drawer_btn_interview: string;
  drawer_btn_cover: string;
  drawer_btn_keywords: string;

  // Tabs & Stages
  tab_inbox: string;
  tab_all: string;
  tab_evaluated: string;
  tab_applied: string;
  tab_responded: string;
  tab_interview: string;
  tab_offer: string;
  tab_hired: string;
  tab_rejected: string;
  tab_discarded: string;
  tab_skip: string;

  // Table columns & Sort
  col_company: string;
  col_role: string;
  col_score: string;
  col_status: string;
  col_date: string;
  col_actions: string;

  // Actions & Badges
  action_report: string;
  action_open: string;
  action_change_status: string;
  status_saved: string;
  badge_via: string;
  quick_filter_all: string;
  quick_filter_interview: string;
  quick_filter_offer: string;

  // Empty states
  empty_inbox_title: string;
  empty_inbox_desc: string;
  empty_inbox_btn: string;
  empty_inbox_terminal: string;
  empty_matches_title: string;
  empty_matches_desc: string;

  // Common
  lang_switch: string;
  theme_toggle: string;
}

export const DICTIONARY: Record<Locale, Translations> = {
  ko: {
    nav_today: "오늘 요약",
    nav_explore: "공고 탐색",
    nav_pipeline: "공고 진행 현황",
    nav_followups: "후속 조치",
    nav_portals: "채용 포털",
    nav_analytics: "통계 및 분석",
    nav_cv: "이력서 관리",
    nav_config: "설정",

    home_today_tag: "오늘 일정",
    home_all_caught_up: "모든 확인이 완료되었습니다.",
    home_new_matches: "이번 주 신규 공고 {count}건",
    home_followups_due: "후속 조치 필요 {count}건",
    home_subtitle_clear: "백그라운드에서 계속 공고를 탐색하여 적합한 포지션이 나오면 알려드릴게요.",
    home_subtitle_action: "오늘 확인할 공고 탐색 및 후속 조치 목록입니다.",
    home_btn_explore: "새 공고 탐색하기",
    home_btn_pipeline: "공고 진행 현황 열기",
    home_sec_followups: "후속 조치 대기",
    home_sec_followups_hint: "지원 후 적절한 후속 연락은 합격률을 높입니다.",
    home_sec_awaiting: "결정 대기 중인 공고",
    home_sec_awaiting_hint: "평가가 완료되어 지원 여부 결정이 필요한 공고입니다.",
    home_sec_fresh: "이번 주 신규 추천 공고",
    home_sec_fresh_hint: "이력서 조건에 맞춰 무료로 탐색된 새로운 채용 기회입니다.",

    pipeline_title: "공고 진행 현황",
    pipeline_subtitle: "수집함 {inbox}건 대기 · 전체 {tracked}건 지원 관리 중",
    search_placeholder: "회사명 또는 포지션 검색...",
    view_table: "테이블 뷰",
    view_grid: "카드 뷰",
    view_kanban: "칸반 보드",
    filter_top_matches: "★ 4.0점 이상 (추천)",
    filter_clear: "필터 해제",
    filter_score_label: "점수",
    filter_active_only: "진행 중 공고",
    filter_interviews_only: "면접 및 오퍼",
    filter_all_jobs: "전체 공고",
    pipeline_stages_title: "채용 전형 단계별 현황",
    funnel_conversion: "전환율",

    kanban_col_evaluated: "검토 완료",
    kanban_col_applied: "지원 완료",
    kanban_col_responded: "서류 통과",
    kanban_col_interview: "면접 진행",
    kanban_col_offer: "최종 오퍼",
    kanban_col_archived: "종료 / 보류",
    kanban_advance_next: "다음 단계로 이동",
    kanban_empty_col: "해당 단계의 공고가 없습니다",

    drawer_title: "공고 상세 정보",
    drawer_view_report: "상세 리포트 보기",
    drawer_external_posting: "원문 공고 열기",
    drawer_copy_info: "정보 복사",
    drawer_copied: "복사되었습니다!",
    drawer_stage_progress: "채용 전형 진행 단계",
    drawer_notes: "메모 및 진행 기록",
    drawer_no_notes: "기록된 메모가 없습니다.",
    score_tier_exceptional: "최고 적합도",
    score_tier_strong: "높은 적합도",
    score_tier_good: "보통 적합도",
    score_tier_moderate: "기준 미달 / 검토 필요",

    report_tab_overview: "평가 리포트",
    report_tab_keywords: "ATS 키워드 분석",
    report_tab_interview: "실전 면접 허브",
    report_tab_cover: "자소서 스튜디오",
    report_tab_negotiation: "처우 협상",
    drawer_btn_interview: "면접 준비",
    drawer_btn_cover: "자소서 작성",
    drawer_btn_keywords: "키워드 분석",

    tab_inbox: "수집함",
    tab_all: "전체",
    tab_evaluated: "평가완료",
    tab_applied: "지원완료",
    tab_responded: "서류통과",
    tab_interview: "면접진행",
    tab_offer: "최종오퍼",
    tab_hired: "최종합격",
    tab_rejected: "불합격",
    tab_discarded: "보류",
    tab_skip: "건너뜀",

    col_company: "회사명",
    col_role: "직무 / 포지션",
    col_score: "적합도 점수",
    col_status: "진행 상태",
    col_date: "일자",
    col_actions: "리포트/링크",

    action_report: "리포트",
    action_open: "원문 공고",
    action_change_status: "상태 변경",
    status_saved: "저장됨",
    badge_via: "경유",
    quick_filter_all: "전체 목록",
    quick_filter_interview: "면접 진행 중",
    quick_filter_offer: "오퍼 수령",

    empty_inbox_title: "수집함이 비어있습니다",
    empty_inbox_desc: "원티드 등 채용 포털에서 내 이력서에 맞는 새로운 공고를 자동으로 스캔해보세요.",
    empty_inbox_btn: "새 공고 스캔 시작하기",
    empty_inbox_terminal: "터미널에서 실행하려면: career-ops scan 실행 또는 data/pipeline.md에 링크 추가",
    empty_matches_title: "조건에 일치하는 공고가 없습니다",
    empty_matches_desc: "다른 상태 탭을 누르거나 검색어를 초기화해보세요.",

    lang_switch: "언어 전환",
    theme_toggle: "테마 전환",
  },
  en: {
    nav_today: "Today",
    nav_explore: "Explore",
    nav_pipeline: "Pipeline",
    nav_followups: "Follow-ups",
    nav_portals: "Portals",
    nav_analytics: "Analytics",
    nav_cv: "CV",
    nav_config: "Config",

    home_today_tag: "today",
    home_all_caught_up: "You're all caught up.",
    home_new_matches: "{count} new matches this week",
    home_followups_due: "{count} follow-ups due",
    home_subtitle_clear: "I'll keep scanning the market in the background and surface anything that fits.",
    home_subtitle_action: "Your action queue for today — discovery and follow-ups, in one place.",
    home_btn_explore: "Find new roles",
    home_btn_pipeline: "Open pipeline",
    home_sec_followups: "Follow-ups due",
    home_sec_followups_hint: "Keep your applications alive — a nudge beats silence",
    home_sec_awaiting: "Awaiting your decision",
    home_sec_awaiting_hint: "Roles already evaluated into reports, ready for a decision.",
    home_sec_fresh: "New matches this week",
    home_sec_fresh_hint: "Zero tokens — discovered by free scans matching your profile.",

    pipeline_title: "Application Pipeline",
    pipeline_subtitle: "{inbox} pending in inbox · {tracked} applications tracked",
    search_placeholder: "Search company or role…",
    view_table: "Table",
    view_grid: "Cards",
    view_kanban: "Kanban Board",
    filter_top_matches: "★ Score ≥ 4.0 (Top Match)",
    filter_clear: "Clear filter",
    filter_score_label: "score",
    filter_active_only: "Active Roles",
    filter_interviews_only: "Interviews & Offers",
    filter_all_jobs: "All Applications",
    pipeline_stages_title: "Pipeline Stage Funnel",
    funnel_conversion: "conv.",

    kanban_col_evaluated: "Evaluated",
    kanban_col_applied: "Applied",
    kanban_col_responded: "Responded",
    kanban_col_interview: "Interview",
    kanban_col_offer: "Offer / Hired",
    kanban_col_archived: "Archived",
    kanban_advance_next: "Advance to Next Stage",
    kanban_empty_col: "No applications in this stage",

    drawer_title: "Application Details",
    drawer_view_report: "View Full Report",
    drawer_external_posting: "View Job Posting",
    drawer_copy_info: "Copy Details",
    drawer_copied: "Copied to clipboard!",
    drawer_stage_progress: "Hiring Stage Progress",
    drawer_notes: "Notes & Timeline",
    drawer_no_notes: "No notes recorded yet.",
    score_tier_exceptional: "Exceptional Match",
    score_tier_strong: "Strong Match",
    score_tier_good: "Good Fit",
    score_tier_moderate: "Moderate / Review Needed",

    report_tab_overview: "Evaluation Report",
    report_tab_keywords: "ATS Keywords",
    report_tab_interview: "Interview Prep",
    report_tab_cover: "Cover Letter",
    report_tab_negotiation: "Negotiation",
    drawer_btn_interview: "Interview Prep",
    drawer_btn_cover: "Cover Letter",
    drawer_btn_keywords: "ATS Keywords",

    tab_inbox: "INBOX",
    tab_all: "ALL",
    tab_evaluated: "EVALUATED",
    tab_applied: "APPLIED",
    tab_responded: "RESPONDED",
    tab_interview: "INTERVIEW",
    tab_offer: "OFFER",
    tab_hired: "HIRED",
    tab_rejected: "REJECTED",
    tab_discarded: "DISCARDED",
    tab_skip: "SKIP",

    col_company: "Company",
    col_role: "Role",
    col_score: "Score",
    col_status: "Status",
    col_date: "Date",
    col_actions: "Report / Link",

    action_report: "Report",
    action_open: "Open Posting",
    action_change_status: "Change Status",
    status_saved: "Saved",
    badge_via: "via",
    quick_filter_all: "All Tracked",
    quick_filter_interview: "Active Interviews",
    quick_filter_offer: "Offers Received",

    empty_inbox_title: "Your inbox is empty",
    empty_inbox_desc: "Find roles that match your CV — free, no tokens spent.",
    empty_inbox_btn: "Run your first free scan",
    empty_inbox_terminal: "Prefer the terminal? Run career-ops scan, or add job URLs to data/pipeline.md.",
    empty_matches_title: "No matches found",
    empty_matches_desc: "Try a different tab or clear the search query.",

    lang_switch: "Switch Language",
    theme_toggle: "Toggle Theme",
  },
};

export const TAB_TRANSLATION_KEYS: Record<string, keyof Translations> = {
  INBOX: "tab_inbox",
  ALL: "tab_all",
  EVALUATED: "tab_evaluated",
  APPLIED: "tab_applied",
  RESPONDED: "tab_responded",
  INTERVIEW: "tab_interview",
  OFFER: "tab_offer",
  HIRED: "tab_hired",
  REJECTED: "tab_rejected",
  DISCARDED: "tab_discarded",
  SKIP: "tab_skip",
};

export const COL_TRANSLATION_KEYS: Record<string, keyof Translations> = {
  company: "col_company",
  role: "col_role",
  score: "col_score",
  status: "col_status",
  date: "col_date",
};
