import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function IsTimeRange(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isTimeRange',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'string') return false;

          const v = value.replace(/\s+/g, '');
          const [start, end] = v.split('-');
          if (!start || !end) return false;

          const startTime = dayjs(start, 'HH:mm', true);
          const endTime = dayjs(end, 'HH:mm', true);

          if (!startTime.isValid() || !endTime.isValid()) return false;

          return endTime.isAfter(startTime);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a time range in HH:mm-HH:mm format, where start < end`;
        },
      },
    });
  };
}
