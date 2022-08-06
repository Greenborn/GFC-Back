<?php

use yii\db\Migration;

/**
 * Class m220805_124816_ranking
 */
class m220805_124816_ranking extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
      $this->createTable('profiles_ranking', [
        'id'             => $this->primaryKey(),
        'profile_id'     => $this->integer()->notNull(),
        'name'           => $this->text(),
        'score'          => $this->integer()->notNull(),
        'prizes'         => $this->text(1024),
      ]);

      $this->createTable('fotoclub_ranking', [
        'id'             => $this->primaryKey(),
        'fotoclub_id'    => $this->integer()->notNull(),
        'name'           => $this->text(),
        'score'          => $this->integer()->notNull(),
        'prizes'         => $this->text(1024),
      ]);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m220805_124816_ranking cannot be reverted.\n";

        return false;
    }
}
