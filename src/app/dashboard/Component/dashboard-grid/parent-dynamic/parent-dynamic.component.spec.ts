import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ParentDynamicComponent } from './parent-dynamic.component';

describe('ParentDynamicComponent', () => {
  let component: ParentDynamicComponent;
  let fixture: ComponentFixture<ParentDynamicComponent>;
  CommonTestingModule.setUpTestBed(ParentDynamicComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ParentDynamicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentDynamicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
