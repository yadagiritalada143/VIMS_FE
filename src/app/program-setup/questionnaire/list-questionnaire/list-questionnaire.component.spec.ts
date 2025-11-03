import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListQuestionnaireComponent } from './list-questionnaire.component';

describe('ListQuestionnaireComponent', () => {
  let component: ListQuestionnaireComponent;
  let fixture: ComponentFixture<ListQuestionnaireComponent>;
  CommonTestingModule.setUpTestBed(ListQuestionnaireComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListQuestionnaireComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
