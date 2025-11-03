import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { LinkedModulesComponent } from './linked-modules.component';

describe('LinkedModulesComponent', () => {
  let component: LinkedModulesComponent;
  let fixture: ComponentFixture<LinkedModulesComponent>;
  CommonTestingModule.setUpTestBed(LinkedModulesComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkedModulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkedModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
