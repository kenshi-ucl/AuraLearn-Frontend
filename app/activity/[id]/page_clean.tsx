// This is just the tail end of the file to replace the messy ending
      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        onClose={handleCelebrationClose}
        activityTitle={activity.title}
        activityNumber={parseInt(activityId) || 1}
      />
    </div>
  )
}
