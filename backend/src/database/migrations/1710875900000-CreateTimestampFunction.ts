import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimestampFunction1710875900000
  implements MigrationInterface
{
  name = 'CreateTimestampFunction1710875900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updatedAt = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS trigger_set_timestamp`);
  }
}
