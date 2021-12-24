<?php

use yii\db\Migration;

/**
 * Class m211224_142101_alter_table_user_signup
 */
class m211224_142101_alter_table_user_signup extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('user', 'email', $this->string());
        $this->addColumn('user', 'sign_up_verif_code', $this->string());
        $this->addColumn('user', 'sign_up_verif_token', $this->string());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m211224_142101_alter_table_user_signup cannot be reverted.\n";

        return false;
    }
}
