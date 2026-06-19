import { IsString, IsOptional, IsNumber, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._\-\s]+$/, {
    message: 'Server name can only contain letters, numbers, spaces, dots, dashes and underscores',
  })
  serverName: string;

  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsNumber()
  nestId?: number;

  @IsOptional()
  @IsNumber()
  eggId?: number;
}
