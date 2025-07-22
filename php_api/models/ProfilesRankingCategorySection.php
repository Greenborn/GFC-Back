<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "profiles_ranking_category_section".
 *
 * @property int $id
 * @property int $profile_id
 * @property int $section_id
 * @property int $category_id
 * @property int $puntaje_temporada
 * @property int $score_total
 * @property string|null $prizes
 * @property string|null $name
 * @property string|null $premios_temporada
 *
 * @property Category $category
 * @property Profile $profile
 * @property Section $section
 */
class ProfilesRankingCategorySection extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'profiles_ranking_category_section';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['profile_id', 'section_id', 'category_id', 'puntaje_temporada', 'score_total'], 'required'],
            [['profile_id', 'section_id', 'category_id', 'puntaje_temporada', 'score_total'], 'default', 'value' => null],
            [['profile_id', 'section_id', 'category_id', 'puntaje_temporada', 'score_total'], 'integer'],
            [['prizes', 'name', 'premios_temporada'], 'string'],
            [['category_id'], 'exist', 'skipOnError' => true, 'targetClass' => Category::className(), 'targetAttribute' => ['category_id' => 'id']],
            [['profile_id'], 'exist', 'skipOnError' => true, 'targetClass' => Profile::className(), 'targetAttribute' => ['profile_id' => 'id']],
            [['section_id'], 'exist', 'skipOnError' => true, 'targetClass' => Section::className(), 'targetAttribute' => ['section_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'profile_id' => 'Profile ID',
            'section_id' => 'Section ID',
            'category_id' => 'Category ID',
            'puntaje_temporada' => 'Puntaje Temporada',
            'score_total' => 'Score Total',
            'prizes' => 'Prizes',
            'name' => 'Name',
            'premios_temporada' => 'Premios Temporada',
        ];
    }

    /**
     * Gets query for [[Category]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getCategory()
    {
        return $this->hasOne(Category::className(), ['id' => 'category_id']);
    }

    /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id']);
    }

    /**
     * Gets query for [[Section]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getSection()
    {
        return $this->hasOne(Section::className(), ['id' => 'section_id']);
    }
}
