<?php

use yii\db\Migration;

/**
 * Class m220221_230117_abm_enlaces
 */
class m220221_230117_abm_enlaces extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('contests_records', [
            'id'             => $this->primaryKey(),
            'url'            => $this->string(),
            'object'         => $this->text(),
            'contest_id'     => $this->integer()->notNull()
        ]);

        $this->addForeignKey(
            'fk_contests_records',
            'contests_records',
            'contest_id',
            'contest',
            'id'
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m220221_230117_abm_enlaces cannot be reverted.\n";
        return false;
    }

}
