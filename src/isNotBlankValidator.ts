import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNotBlankValidator(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isNotBlank',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          return typeof value === 'string' && value.trim().length > 0;
        }
      }
    });
  };
}
