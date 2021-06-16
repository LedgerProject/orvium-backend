import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './template.schema';
import { TemplateService } from './template.service';

@Module({
  providers: [TemplateService],
  controllers: [],
  imports: [
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }]),
  ],
  exports: [TemplateService]
})
export class TemplateModule {
}
