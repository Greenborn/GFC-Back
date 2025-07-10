<?php

use yii\db\Migration;

/**
 * Class m220121_171437_add_field_sub_title_in_contest
 */
class m220121_171437_add_field_sub_title_in_contest extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {   
        $this->addColumn('contest', 'sub_title', $this->string());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m220121_171437_add_field_sub_title_in_contest cannot be reverted.\n";

        return false;
    }
}
