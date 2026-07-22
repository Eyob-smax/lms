import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Enterprise BPO LMS API Service Online' };
  }
}
