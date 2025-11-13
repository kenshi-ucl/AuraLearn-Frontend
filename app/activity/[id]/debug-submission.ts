// Debug helper to log submission responses
export function debugSubmissionResponse(submission: any, activityId: string | number) {
  console.group(`🔍 DEBUG: Activity ${activityId} Submission Response`);
  
  // Log key validation fields
  console.log('✅ success:', submission.success);
  console.log('🎯 is_completed:', submission.is_completed);
  console.log('📊 score:', submission.score);
  console.log('📝 completion_status:', submission.completion_status);
  console.log('🔢 attempt_number:', submission.attempt_number);
  
  // Log validation details
  if (submission.validation_summary) {
    console.log('📋 Validation Summary:', {
      passed: submission.validation_summary.overall?.passed,
      total: submission.validation_summary.overall?.total,
      percentage: submission.validation_summary.overall?.percentage
    });
  }
  
  // Highlight the issue
  if (submission.is_completed === false) {
    console.warn('⚠️ ACTIVITY NOT COMPLETED - Should NOT show celebration!');
  } else if (submission.is_completed === true) {
    console.log('🎉 Activity completed - Celebration is appropriate');
  }
  
  // Full response for debugging
  console.log('📦 Full Response:', submission);
  console.groupEnd();
}

// Helper to ensure proper type checking
export function isActivityCompleted(submission: any): boolean {
  // Strict type checking to avoid any truthy/falsy confusion
  return submission.is_completed === true;
}
