export enum PendingItemTypes {
    AdditionalBudget = 'additional_budget',
    UpdateAssignment = 'update',
    CreateAssignment = 'create',
    Terminate = 'terminate',
    ReviewAssignment = 'review_assignment'
}

export enum SubStatusTypes {
    PendingReview = 'pending_review',
    PendingOnboarding = 'pending_onboarding',
    PendingApproval = 'pending_approval',
}
