import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class SetupAdminDto {
  @IsString()
  setupKey: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  // BUG-L1 FIX: Match RegisterDto password complexity requirements
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}
