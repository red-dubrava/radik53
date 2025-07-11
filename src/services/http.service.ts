import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpService {
  async getJson(url: string, requestInit?: Omit<RequestInit, 'method'>): Promise<unknown> {
    const response = await this.#request(url, { ...requestInit, method: 'GET' });
    return response.json();
  }

  async postJson(url: string, requestInit?: Omit<RequestInit, 'method'>): Promise<unknown> {
    const response = await this.#request(url, { ...requestInit, method: 'POST' });
    return response.json();
  }

  async #request(url: string, requestInit?: RequestInit): Promise<Response> {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Request error: ${message}`);
    }

    return response;
  }
}
