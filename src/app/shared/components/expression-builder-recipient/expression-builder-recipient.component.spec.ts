import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpressionBuilderRecipientComponent } from './expression-builder-recipient.component';

describe('ExpressionBuilderRecipientComponent', () => {
  let component: ExpressionBuilderRecipientComponent;
  let fixture: ComponentFixture<ExpressionBuilderRecipientComponent>;
  CommonTestingModule.setUpTestBed(ExpressionBuilderRecipientComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpressionBuilderRecipientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressionBuilderRecipientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
