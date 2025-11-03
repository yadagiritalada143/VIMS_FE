import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { AllProgressUpdateComponent } from './all-progress-update.component';

describe('AllProgressUpdateComponent', () => {
  let component: AllProgressUpdateComponent;
  let fixture: ComponentFixture<AllProgressUpdateComponent>;
  CommonTestingModule.setUpTestBed(AllProgressUpdateComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllProgressUpdateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllProgressUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
