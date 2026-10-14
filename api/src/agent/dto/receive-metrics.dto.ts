import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'

export class DiskItemDto {
  @IsString()
  device: string;
  @IsNumber()
  total_bytes: number;
  @IsNumber()
  used_bytes: number;
  @IsNumber()
  percent: number;
}

export class ReceiveMetricsDto {
  // Identificação da Máquina
  @IsString()
  machineId: string;

  @IsString()
  hostname: string;

  // CPU
  @IsNumber()
  cpu_percent: number;

  // Memória
  @IsNumber()
  memory_total_bytes: number;

  @IsNumber()
  memory_used_bytes: number;

  @IsNumber()
  memory_percent: number;

  // Disco
  @IsArray()
  disks: DiskItemDto[];
}
