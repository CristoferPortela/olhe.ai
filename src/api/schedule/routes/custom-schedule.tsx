export default {
  routes: [
    { // Path defined with a regular expression
      method: 'POST',
      path: '/schedule/create', // Only match when the first parameter contains 2 or 3 digits.
      handler: 'custom-schedule.createSchedule',
      config: {
        auth: false,
      },
    }
  ]
}
