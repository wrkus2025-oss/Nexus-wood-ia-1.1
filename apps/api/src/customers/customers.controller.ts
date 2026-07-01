import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Req() req: { user: JwtUser }) {
    return this.customersService.findAll(req.user.userId);
  }

  @Post()
  create(@Req() req: { user: JwtUser }, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.user.userId, dto);
  }

  @Get(':id')
  get(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.customersService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.customersService.remove(req.user.userId, id);
  }

  @Get(':id/projects')
  projects(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.customersService.findOne(req.user.userId, id).then((customer) => customer.projects);
  }
}
