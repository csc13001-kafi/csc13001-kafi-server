import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

export const ParseFormData = createParamDecorator(
    async (dto: any, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const formData = request.body;

        if (formData.products && typeof formData.products === 'string') {
            formData.products = formData.products.split(',');
        }
        if (formData.quantities && typeof formData.quantities === 'string') {
            formData.quantities = formData.quantities.split(',').map(Number);
        }

        if (formData.time) {
            try {
                const date = new Date(formData.time);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date format');
                }
                formData.time = date.toISOString();
            } catch (error: any) {
                throw new Error(error.message);
            }
        }

        const transformedDto = plainToClass(dto, formData);

        const errors = await validate(transformedDto);
        if (errors.length > 0) {
            throw new Error(
                errors
                    .map((error) => Object.values(error.constraints))
                    .join(', '),
            );
        }

        return transformedDto;
    },
);
