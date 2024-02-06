/**
 * schedule controller
 */

import {factories} from '@strapi/strapi'
import {errors, sanitize} from "@strapi/utils";
import moment from "moment";

export default factories.createCoreController('api::schedule.schedule',
  ({strapi}) => ({
    find(ctx) {
      return super.find(ctx)
    },
    findOne(ctx) {
      return super.findOne(ctx)
    },
    async create(ctx, next) {
      const contentType = strapi.contentType("api::schedule.schedule");
      const body = await sanitize.contentAPI.input(ctx.request.body, contentType) as never as MakeScheduleBody

      const {Entrance, Exit} = hourFormat(body)
      validateType(body)

      if (!body.notValidateTotalHours) {
        validateTotalHours(body, Entrance, Exit)
      }
      validateDays(body)

      const schedule = await strapi.entityService.create('api::schedule.schedule', {
        data: {
          Name: body.Name,
          Type: body.Type,
          Tolerance: body.Tolerance_time,
        },
      });
      const scheduleTiming = await strapi.entityService.create('api::schedule-timing.schedule-timing', {
        data: {
          Days: JSON.stringify(body.Days),
          Entrance: Entrance.format("HH:mm:SS.SSS"),
          Exit: Exit.format("HH:mm:ss.SSS"),
          parent_id: schedule.id
        }
      }).catch(() => {
        // We must remove the just created schedule to avoid problems later
        strapi.entityService.delete('api::schedule.schedule', schedule.id)
        throw new errors.ValidationError("Could not save data")
      })

      let intervalList = []
      for (const interval of body.Interval) {
        const {Entrance, Exit} = hourFormat({Entrance: interval.start_interval, Exit: interval.exit_interval})

        strapi.entityService.create('api::scheduleinterval.scheduleinterval', {
          data: {
            Day: JSON.stringify(body.Days),
            AutomaticalyRegister: interval.automaticaly_register,
            StartInterval: Entrance.format("HH:mm:SS.SSS"),
            ExitInterval: Exit.format("HH:mm:SS.SSS"),
            Pay: interval.pay,
            schedule_timing: scheduleTiming.id
          }
        }).catch((err) => {
          for (const il of intervalList) {
            strapi.entityService.delete('api::scheduleinterval.scheduleinterval', il)
          }
          strapi.entityService.delete('api::schedule-timing.schedule-timing', scheduleTiming.id)
          strapi.entityService.delete('api::schedule.schedule', schedule.id)
          throw new errors.ValidationError("Could not save data")
        })
      }

      return sanitize.contentAPI.output(schedule, contentType);
    }
  })
);

const matchTime = /\d?\d:\d\d/

const hourFormat = ({Entrance, Exit}) => {
  const errorMessages = []
  if (!Entrance.match(matchTime)) {
    errorMessages.push("Entrance format not match the hour format, ex: 18:00")
  }
  if (!Exit.match(matchTime)) {
    errorMessages.push("Exit format not match the hour format, ex: 18:00")
  }
  if (errorMessages.length > 0) {
    throw new errors.ValidationError("Hour formt is wrong", errorMessages)
  }
  return {
    Entrance: moment(Entrance, "HH:mm"),
    Exit: moment(Exit, "HH:mm")
  }
}

const validateType = (data: MakeScheduleBody) => {
  if (!data.Type.match(/DAY|JOURNEY/)) {
    throw new errors.ValidationError("Type is wrong, it must be DAY or JOURNEY")
  }
}

const validateTotalHours = (data: MakeScheduleBody, Entrance: moment.Moment, Exit: moment.Moment) => {
  // constt hours = hourIndexToTime((Exit.diff(Entrance) / 1000) / 3600)
  let difference = Exit.diff(Entrance)

  data.Interval.forEach((interval) => {
    if (!interval.pay) {
      const {Entrance, Exit} = hourFormat({Entrance: interval.start_interval, Exit: interval.exit_interval})
      const intervalDifference = Exit.diff(Entrance)
      difference -= intervalDifference
    }
  })
  difference *= data.Days.length

  const h = ((difference / 1000) / 3600)
  if (h > 44) {
    throw new errors.ValidationError(`Total week hours exceed 44h (this schedule reached ${h})`)
  }
}

const validateDays = (data: MakeScheduleBody) => {
  // Returns false if it is correctly formated, true if not
  const days = data.Days.map((day) => typeof day != 'number' || day < 0 || day > 6)
  if (days.includes(true)) {
    throw new errors.ValidationError(`Days of the week are invalid, you musk send only numbers, starting sunday = 0 and finishing saturnday = 6`)
  }
}

const hourIndexToTime = (num) => (
  ('0' + Math.floor(num) % 24).slice(-2) + ':' + ((num % 1) * 60 + '0').slice(0, 2)
)


type ScheduleType = "DAY" | "JOURNEY"

type Interval = {
  automaticaly_register: boolean
  start_interval: string
  exit_interval: string
  // Pay is the same as "abono" in portuguese
  pay: boolean
}

type MakeScheduleBody = {
  Name: string
  Type: ScheduleType
  Entrance: string
  Exit: string
  Interval: Interval[]

  // Days in number
  Days: number[]
  // ToleranceTime in minutes
  Tolerance_time: number

  notValidateTotalHours?: boolean
}

