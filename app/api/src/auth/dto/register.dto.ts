import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @MinLength(8)
  password!: string

  @IsNotEmpty()
  @MaxLength(20)
  username!: string
}