import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should have GraphQL endpoint working', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          {
            __schema {
              types {
                name
              }
            }
          }
        `,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.__schema).toBeDefined();
        expect(Array.isArray(res.body.data.__schema.types)).toBe(true);
      });
  });
});
