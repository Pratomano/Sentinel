import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @IsEmail({}, {message: 'Informe um e-mail válido'})
    @IsNotEmpty({ message: 'O e-mail é obrigatório'})
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória'})
    password: string;
}