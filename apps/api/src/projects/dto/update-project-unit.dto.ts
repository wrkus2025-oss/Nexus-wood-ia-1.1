import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectUnitDto } from './create-project-unit.dto';

export class UpdateProjectUnitDto extends PartialType(CreateProjectUnitDto) {}
