import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SimplifyAssistComponent } from './simplify-assist.component';

describe('SimplifyAssistComponent', () => {
  let component: SimplifyAssistComponent;
  let fixture: ComponentFixture<SimplifyAssistComponent>;
  CommonTestingModule.setUpTestBed(SimplifyAssistComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SimplifyAssistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimplifyAssistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
