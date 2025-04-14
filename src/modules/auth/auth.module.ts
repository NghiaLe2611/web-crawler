import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
	imports: [
		HttpModule,
		ConfigModule,
		ClientsModule.register([
			{
				name: 'AUTH_SERVICE',
				transport: Transport.TCP,
				options: {
					host: '0.0.0.0',
					port: 8001,
				},
			},
		]),
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService, ClientsModule],
})
export class AuthModule {}
