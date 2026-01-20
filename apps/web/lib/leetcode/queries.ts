// ============== GraphQL Queries for LeetCode API ==============

/**
 * Query to get user profile information
 */
export const USER_PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      aboutMe
      userAvatar
      ranking
      reputation
      starRating
      websites
      countryName
      company
      school
      skillTags
      linkedinUrl
      twitterUrl
      githubUrl
    }
  }
}
`;

/**
 * Query to get user submission statistics
 */
export const USER_SUBMIT_STATS_QUERY = `
query getUserSubmitStats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
      totalSubmissionNum {
        difficulty
        count
      }
    }
  }
}
`;

/**
 * Query to get recent submissions
 */
export const RECENT_SUBMISSIONS_QUERY = `
query getRecentSubmissions($username: String!, $limit: Int!) {
  recentSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
`;

/**
 * Query to get user's submission calendar (heatmap data)
 */
export const USER_CALENDAR_QUERY = `
query getUserCalendar($username: String!, $year: Int) {
  matchedUser(username: $username) {
    userCalendar(year: $year) {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
}
`;

/**
 * Query to get problem details by slug
 */
export const PROBLEM_DETAILS_QUERY = `
query getProblemDetails($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    titleSlug
    difficulty
    isPaidOnly
    topicTags {
      name
      slug
    }
    stats
    content
    hints
  }
}
`;

/**
 * Query to get the daily coding challenge
 */
export const DAILY_CHALLENGE_QUERY = `
query getDailyChallenge {
  activeDailyCodingChallengeQuestion {
    date
    link
    question {
      questionFrontendId
      title
      titleSlug
      difficulty
    }
  }
}
`;

/**
 * Combined query for efficiency - fetches all user data in one request
 */
export const USER_COMPLETE_DATA_QUERY = `
query getUserCompleteData($username: String!, $year: Int) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar(year: $year) {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
  recentSubmissionList(username: $username, limit: 20) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
`;

/**
 * Query to get all problems (paginated)
 */
export const PROBLEM_LIST_QUERY = `
query getProblemList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total
    questions {
      questionFrontendId
      title
      titleSlug
      difficulty
      topicTags {
        name
        slug
      }
      stats
    }
  }
}
`;

/**
 * Query to search problems by keyword
 */
export const SEARCH_PROBLEMS_QUERY = `
query searchProblems($query: String!) {
  problemsetQuestionList: questionList(
    filters: { searchKeywords: $query }
    limit: 20
  ) {
    questions {
      questionFrontendId
      title
      titleSlug
      difficulty
    }
  }
}
`;
